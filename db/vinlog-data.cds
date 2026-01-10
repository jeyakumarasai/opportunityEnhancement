namespace db.vinlog;

using {cuid} from '@sap/cds/common';

entity vinheader {
    key opportunityID : String(35) @title: '{i18n>opportunityUUID}';
        items_success : Composition of many vinsuccess
                            on items_success.parent = $self;
        items_failure : Composition of many vinfailure
                            on items_failure.parent = $self;
}

entity vinsuccess : cuid {
    customerID   : String(10) @title: '{i18n>customerID}';
    vinID        : String(60);

    @title: '{i18n>vinID}'
    productID    : String(35);

    @title: '{i18n>productID}'
    product_Desc : String(255);

    @title: '{i18n>product_Desc}'
    make_OE      : String(35);

    @title: '{i18n>make_OE}'
    model        : String(35);

    @title: '{i18n>model}'
    year         : String(4);

    @title: '{i18n>year}'
    dateTime     : DateTime;

    @title: '{i18n>dateTime}'
    duplicate    : String(5);

    @title: '{i18n>duplicate}'
    parent       : Association to vinheader;
}


entity vinfailure : cuid {
    customerID   : String(10)  @title: '{i18n>customerID}';
    vinID        : String(60)  @title: '{i18n>vinID}';
    productID    : String(35)  @title: '{i18n>productID}';
    errorMessage : String(255) @title: '{i18n>errorMessage}';
    make_OE      : String(35)  @title: '{i18n>make_OE}';
    model        : String(35)  @title: '{i18n>model}';
    year         : String(4)   @title: '{i18n>year}';
    dateTime     : DateTime    @title: '{i18n>dateTime}';
    duplicate    : String(5)   @title: '{i18n>duplicate}';
    parent       : Association to vinheader;
}

entity historicvindata_header {
    key opportunityID : String(35) @title: '{i18n>opportunityID}';
        items         : Composition of many historicvindata_items
                            on items.parent = $self;

};

entity historicvindata_items : cuid {
    customerID   : String(10) @title: '{i18n>customerID}';
    vinID        : String(60) @title: '{i18n>vinID}';
    productID    : String(60) @title: '{i18n>productID}';
    product_Desc : String     @title: '{i18n>product_Desc}';
    make_OE      : String     @title: '{i18n>make_oe}';
    model        : String     @title: '{i18n>model}';
    year         : String(4)  @title: '{i18n>Year}';
    parent       : Association to historicvindata_header;
}
