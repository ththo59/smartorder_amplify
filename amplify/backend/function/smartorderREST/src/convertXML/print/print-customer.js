"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintCustomerService = void 0;
const epos_print_1 = require("../library/epos-print");
const print_model_1 = require("../model/print.model");
const common_service_1 = require("../common/common-service");
class PrintCustomerService extends common_service_1.CommonService {
    /**
     *
     * @param data
     * @param printJobId
     * @param indexPrint
     */
    createPrint(data, printJobId, indexPrint = null) {
        // initial ePos
        let builder = new epos_print_1.ePos();
        builder.addTextSmooth(true);
        let params = new print_model_1.ParameterModel();
        this.renderJSON2XML(data, printJobId, indexPrint, builder, params);
        params.devid = data.printDeviceId;
        params.printjobid = indexPrint && printJobId ? printJobId + '_' + indexPrint : printJobId;
        let eposPrint = new print_model_1.EPOSPrintModel();
        eposPrint.Parameter = params;
        eposPrint.PrintData = builder.toString();
        return {
            deviceId: data.printDeviceId,
            printType: this.EPSON_PRINT,
            printerIP: data.ipPrinter,
            printjobid: indexPrint ? printJobId + '_' + indexPrint : printJobId,
            xml: this.addPrintXMLContent(eposPrint).toString()
        };
    }
    /**
     *
     * @param data
     * @param printJobId
     * @param indexPrint
     * @param builder
     * @param params
     */
    renderJSON2XML(data, printJobId, indexPrint, builder, params) {
        builder.addTextLang(this.LANG_JAPANESE);
        this.renderHeader(data, builder);
        this.canvasDrawDashLine(builder);
        this.renderMainContent(data, builder);
        this.canvasDrawDashLine(builder);
        this.renderFooter(data, builder);
        builder.addCut(builder.CUT_FEED);
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderHeader(data, builder) {
        this.renderHeaderTitle(data.isFirstOrder, builder);
        this.renderTableName(data.tableName, builder);
        this.renderDateTimeOrder(data, builder);
        this.renderNumberCustomer(data.numCustomers, builder);
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderHeaderTitle(isFirstOrder, builder) {
        // Set header render by first order or NOT
        if (isFirstOrder !== 'true' && isFirstOrder !== true) {
            this.addPrintHeader(builder, '追加注文');
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderTableName(tableName, builder) {
        builder.addTextAlign(builder.ALIGN_LEFT);
        builder.addTextFont(builder.FONT_A);
        builder.addTextSize(2, 2);
        builder.addTextStyle(false, false, false, builder.COLOR_1);
        // Set table name render by first order or NOT
        if (tableName && tableName !== 'null' && tableName !== 'undefined') {
            this.addText(builder, 'テーブル:' + tableName.replace(/&/g, '＆'));
        }
        else {
            this.addText(builder, 'テーブル:' + '');
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderDateTimeOrder(data, builder) {
        builder.addTextFont(builder.FONT_A);
        builder.addTextSize(1, 1);
        let staffName = this.getStaffName(data);
        let staffNameLength = this.getTextByteLength(staffName);
        let date = this.alignTextRight(data.datetime, this.MAX_WIDTH_BYTES_FONT_A - staffNameLength);
        this.addText(builder, staffName + date);
    }
    /**
     *
     * @param num
     * @param builder
     */
    renderNumberCustomer(num, builder) {
        builder.addTextAlign(builder.ALIGN_RIGHT);
        this.addText(builder, num + '人');
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderMainContent(data, builder) {
        for (const item of data.listItems) {
            builder.addTextAlign(builder.ALIGN_LEFT);
            this.addText(builder, this.encodeTextWithSpacingFontA('ロ ' + item.itemName.replace(/&/g, '＆')).text); // item name
            if (item.itemDrillDownName) { // custom tag
                let itemDrillDownName = '  - ' + item.itemDrillDownName.replace(/&/g, '＆');
                this.addText(builder, this.encodeTextWithSpacingFontA(itemDrillDownName).text);
            }
            this.renderItemPriceTag(item.price, item.quantity, builder);
            for (const topping of item.toppingItems) {
                this.renderToppingTag(topping, builder);
            }
        }
    }
    /**
     *
     * @param topping
     * @param builder
     */
    renderToppingTag(topping, builder) {
        let toppingName = '  + ' + topping.itemName.replace(/&/g, '＆');
        let toppingBuffer = this.encodeTextWithSpacingFontA(toppingName);
        let toppingLength = toppingBuffer.textBytes;
        toppingName = toppingBuffer.text;
        let toppingSubPriceText = this.getPriceText(topping.price, topping.quantity);
        let remainder = toppingLength % this.MAX_WIDTH_BYTES_FONT_A;
        if (remainder < this.MAX_WIDTH_BYTES_FONT_A / 2 && remainder > 0) {
            for (let i = 0; i < this.MAX_WIDTH_BYTES_FONT_A / 2 - remainder; i++) {
                toppingName += ' ';
            }
            toppingName += toppingSubPriceText;
            this.addText(builder, toppingName);
        }
        else {
            builder = this.addText(builder, toppingName);
            let priceTagText = '';
            for (let i = 0; i < this.MAX_WIDTH_BYTES_FONT_A / 2; i++) {
                priceTagText += ' ';
            }
            priceTagText += toppingSubPriceText;
            this.addText(builder, priceTagText);
        }
    }
    /**
     *
     * @param price
     * @param quantity
     */
    getPriceText(price, quantity) {
        let priceText = this.convertJapanCurrent(Number(price)).replace('￥', '@') + ' x ' + quantity;
        let priceLength = this.getTextByteLength(priceText);
        let amount = this.convertJapanCurrent(Number(price * quantity));
        let amountLength = this.getTextByteLength(amount);
        let subSpace = this.MAX_WIDTH_BYTES_FONT_A / 2 - (priceLength + amountLength);
        let subPriceText = priceText;
        for (let i = 0; i < subSpace; i++) {
            subPriceText += ' ';
        }
        subPriceText += amount;
        return subPriceText;
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderFooter(data, builder) {
        this.renderSubTotal(data, builder);
        this.renderTableCharge(data, builder);
        this.renderServiceChargePrice(data, builder);
        this.renderTaxExclude(data, builder);
        this.renderTotal(data.total, builder);
        this.renderTax(data, builder);
        this.renderQtyItems(data, builder);
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderSubTotal(data, builder) {
        if (data.subtotal >= 1) {
            this.addSubTotal(builder, data.orderSubTotal, data.subtotal);
        }
        else {
            this.addSubTotalFirst(builder, data.orderSubTotal);
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderTableCharge(data, builder) {
        if (data.tableChargePerPerson >= 1) {
            let tableChargeText = this.alignTextRight('テーブルチャージ', this.MAX_WIDTH_BYTES_FONT_A / 2);
            let tableChargeValue = this.convertJapanCurrent(data.tableChargePerPerson) + ' x ' + data.numCustomers + ' = ' + this.convertJapanCurrent(Number(data.tableChargePerPerson * data.numCustomers));
            let tableCharge = this.alignTextRight(tableChargeValue, this.MAX_WIDTH_BYTES_FONT_A / 2);
            this.addText(builder, tableChargeText + tableCharge);
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderServiceChargePrice(data, builder) {
        if (data.serviceChargePrice >= 1) {
            let serviceChargeText = this.alignTextRight('サービスチャージ', this.MAX_WIDTH_BYTES_FONT_A / 2);
            let serviceChargeValue = data.serviceChargeRate + '%(' + this.convertJapanCurrent(Number(data.serviceChargePrice)) + ')';
            let serviceCharge = this.alignTextRight(serviceChargeValue, this.MAX_WIDTH_BYTES_FONT_A / 2);
            this.addText(builder, serviceChargeText + serviceCharge);
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderTaxExclude(data, builder) {
        if (data.taxExclude >= 1) {
            let taxExcludeText = this.alignTextRight('税', this.MAX_WIDTH_BYTES_FONT_A / 2);
            let taxExclude = this.alignTextRight(this.convertJapanCurrent(data.taxExclude), this.MAX_WIDTH_BYTES_FONT_A / 2);
            this.addText(builder, taxExcludeText + taxExclude);
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderTotal(total, builder) {
        let totalText = this.alignTextLeft('合計金額', this.MAX_WIDTH_BYTES_FONT_A / 2, 2);
        let totalValue = this.alignTextRight(this.convertJapanCurrent(Number(total)), this.MAX_WIDTH_BYTES_FONT_A / 2, 2);
        builder.addTextFont(builder.FONT_A);
        builder.addTextSize(2, 2);
        this.addText(builder, totalText + totalValue);
        builder.addTextFont(builder.FONT_A);
        builder.addTextSize(1, 1);
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderTax(data, builder) {
        let tax = data.tax;
        if (data.taxExclude >= 1) {
            tax += data.taxExclude;
        }
        let taxText = this.alignTextRight('内消費税', this.MAX_WIDTH_BYTES_FONT_A / 2);
        let taxValue = this.alignTextRight('(' + this.convertJapanCurrent(tax) + ')', this.MAX_WIDTH_BYTES_FONT_A / 2);
        this.addText(builder, taxText + taxValue);
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderQtyItems(data, builder) {
        let qtyText = this.alignTextRight('合計点数', this.MAX_WIDTH_BYTES_FONT_A / 2);
        let qty = this.alignTextRight(this.convertJapanCurrent(data.amount).replace('￥', '') + '点', this.MAX_WIDTH_BYTES_FONT_A / 2);
        this.addText(builder, qtyText + qty);
    }
    /**
     *
     * @param builder
     * @param orderSubTotal
     * @param subtotal
     */
    addSubTotal(builder, orderSubTotal, subtotal) {
        let currentSubTotalText = this.alignTextRight('今回注文小計', this.MAX_WIDTH_BYTES_FONT_A / 2);
        let currentSubTotal = this.alignTextRight(this.convertJapanCurrent(orderSubTotal), this.MAX_WIDTH_BYTES_FONT_A / 2);
        this.addText(builder, currentSubTotalText + currentSubTotal);
        let subTotalText = this.alignTextRight('注文済小計', this.MAX_WIDTH_BYTES_FONT_A / 2);
        let subTotalNum = this.alignTextRight(this.convertJapanCurrent(subtotal), this.MAX_WIDTH_BYTES_FONT_A / 2);
        this.addText(builder, subTotalText + subTotalNum);
    }
    /**
     *
     * @param builder
     * @param subtotal
     */
    addSubTotalFirst(builder, subtotal) {
        let subTotalText = this.alignTextRight('小計', this.MAX_WIDTH_BYTES_FONT_A / 2);
        let subTotalNum = this.alignTextRight(this.convertJapanCurrent(subtotal), this.MAX_WIDTH_BYTES_FONT_A / 2);
        this.addText(builder, subTotalText + subTotalNum);
    }
    /**
     *
     * @param price
     * @param quantity
     * @param builder
     * @private
     */
    renderItemPriceTag(price, quantity, builder) {
        let subPriceText = this.getPriceText(price, quantity);
        ;
        let priceTagText = '';
        for (let i = 0; i < this.MAX_WIDTH_BYTES_FONT_A / 2; i++) {
            priceTagText += ' ';
        }
        priceTagText += subPriceText;
        this.addText(builder, priceTagText);
    }
}
exports.PrintCustomerService = PrintCustomerService;
exports.PrintCustomerService = PrintCustomerService;
//# sourceMappingURL=print-customer.js.map
//# sourceMappingURL=print-customer.js.map