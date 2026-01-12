sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    'use strict';

    function _createUploadController(oExtensionAPI) {


        var oUploadDialog;
        function setOkButtonEnabled(bOk) {
            oUploadDialog && oUploadDialog.getBeginButton().setEnabled(bOk);
        }
        function setDialogBusy(bBusy) {
            oUploadDialog.setBusy(bBusy)
        }
        function closeDialog() {
            oUploadDialog && oUploadDialog.close()
        }
        function showError(sMessage) {
            MessageBox.error(sMessage || "Upload failed")
        }
        // TODO: Better option for this?
        function byId(sId) {
            return sap.ui.core.Fragment.byId("uploadDialog", sId);
        }
        return {
            onBeforeOpen: function (oEvent) {
                oUploadDialog = oEvent.getSource();
                oExtensionAPI.addDependent(oUploadDialog);
            },
            onAfterClose: function (oEvent) {
                oExtensionAPI.removeDependent(oUploadDialog);
                oUploadDialog.destroy();
                oUploadDialog = undefined;
            },
            onFileChange: function (oEvent) {
                const file = oEvent.getParameter("files")?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    this._csvText = e.target.result;
                    MessageToast.show("CSV loaded. Click Process.");
                };
                reader.onerror = () => MessageToast.show("Failed to read file.");
                reader.readAsText(file);
            },
            onOk: function (oEvent) {

                if (!this._csvText) {
                    return MessageToast.show("Please select a CSV file first.");
                }
                fetch("/odata/v4/vinlog/uploadMiGTemp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: this._csvText
                    })
                })
                    .then(async (res) => {
                        if (!res.ok) throw new Error(await res.text());
                        return res.json();
                    })
                    .then((data) => {
                        // OData V4 returns the action result as { value: [...] }
                        const rows = data?.value ?? data;
                        if (rows) {
                            MessageToast.show(rows);
                        }
                        else {
                            //this.getView().getModel("result").setData(rows || []);
                            MessageToast.show("Processing complete.");
                        }
                        closeDialog();
                    })
                    .catch((err) => {
                        //console.error(err);
                        let message = 'Unknown error';
                        try {
                            const parsed = JSON.parse(err.message.replace(/^Error:\s*/, ''));
                            message = parsed?.error?.message || message;
                        } catch (e) {
                            message = err.message;
                        }
                        console.log(message)
                        MessageToast.show(message);
                        closeDialog();
                    });
                //setDialogBusy(true)
                // var oFileUploader = byId("uploader")
                // oFileUploader
                //   .checkFileReadable()
                //   .then(function () {
                //      oFileUploader.upload();
                // closeDialog();
                // })
                //.catch(function (error) {
                //   showError("The file cannot be read.");
                //     setDialogBusy(false)
                //  })
            },
            onCancel: function (oEvent) {
                closeDialog();
            },
            onTypeMismatch: function (oEvent) {
                var sSupportedFileTypes = oEvent
                    .getSource()
                    .getFileType()
                    .map(function (sFileType) {
                        return "*." + sFileType;
                    })
                    .join(", ");
                showError(
                    "The file type *." +
                    oEvent.getParameter("fileType") +
                    " is not supported. Choose one of the following types: " +
                    sSupportedFileTypes
                );
            },
            onFileAllowed: function (oEvent) {
                setOkButtonEnabled(true)
            },
            onFileEmpty: function (oEvent) {
                setOkButtonEnabled(false)
            },
            onUploadComplete: function (oEvent) {
                var iStatus = oEvent.getParameter("status");
                var oFileUploader = oEvent.getSource()
                oFileUploader.clear();
                setOkButtonEnabled(false)
                setDialogBusy(false)
                if (iStatus >= 400) {
                    var oRawResponse = JSON.parse(oEvent.getParameter("responseRaw"));
                    showError(oRawResponse && oRawResponse.error && oRawResponse.error.message);
                } else {
                    MessageToast.show("Uploaded successfully");
                    oExtensionAPI.refresh()
                    closeDialog();
                }
            }
        };
    }

    return {
        /**
         * Generated event handler.
         *
         * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
         * @param aSelectedContexts the selected contexts of the table rows.
         */
        UploadMigM: function (oContext, aSelectedContexts) {
            var oController = _createUploadController(this);
            // const oBindingContext = oContext || this.getBindingContext();
            // const vinKey = oBindingContext.getProperty("opportunityID");
            // oController._vinKey = vinKey;
            this.loadFragment({
                id: "uploadDialog",
                name: "historicvin.ext.fragment.UploadDialog",
                controller: oController
            }).then(function (oDialog) {
                oDialog.open();
            });
            MessageToast.show("Custom handler invoked.");
        }
    };
});
