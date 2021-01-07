"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintKitchenService = void 0;
const common_service_1 = require("../common/common-service");
const epos_print_1 = require("../library/epos-print");
const print_model_1 = require("../model/print.model");
const _ = require('lodash');
class PrintKitchenService extends common_service_1.CommonService {
    constructor() {
        super(...arguments);
        this.typeBDots = 20;
        this.printerPortKey = {
            portIP: 'printerIP',
            portIP_02: 'printerIP02'
        };
        this.printerDeviceKey = {
            portIP: 'deviceId',
            portIP_02: 'deviceId_02'
        };
    }
    /**
     *
     * @param data
     * @param printJobId
     * @param indexPrint
     */
    createPrint(data, printJobId, indexPrint = null) {
        const arrDataPrintXml = [];
        const listItemsPrint = this.setKitchenPrinterPort(data);
        for (const key in listItemsPrint) {
            if (Object.prototype.hasOwnProperty.call(listItemsPrint, key)) {
                for (const [index, item] of listItemsPrint[key].entries()) {
                    arrDataPrintXml.push(this.renderItem(index, indexPrint, printJobId, item, data));
                    indexPrint = indexPrint ? indexPrint + 1 : indexPrint;
                }
            }
        }
        return arrDataPrintXml;
    }
    /**
     *
     * @param index
     * @param indexPrint
     * @param item
     * @param data
     * @param builder
     */
    renderItem(index, indexPrint, printJobId, item, data) {
        const params = new print_model_1.ParameterModel();
        params.devid = item.localDeviceId;
        params.printjobid = indexPrint && printJobId ? printJobId + '_' + indexPrint : printJobId;
        let builder = new epos_print_1.ePos();
        builder.addTextSmooth(true);
        this.renderJSON2XML(index, item, data, builder);
        const eposPrint = new print_model_1.EPOSPrintModel();
        eposPrint.Parameter = params;
        eposPrint.PrintData = builder.toString();
        return {
            deviceId: item.localDeviceId,
            menuCode: item.itemId,
            printType: this.PRINT_TYPE_KITCHEN,
            orderDetailNo: item.orderDetailNo,
            printerIP: item.localIPPrinter,
            printjobid: indexPrint && printJobId ? printJobId + '_' + indexPrint : printJobId,
            xml: this.addPrintXMLContent(eposPrint).toString()
        };
    }
    /**
     *
     * @param index
     * @param item
     * @param data
     * @param builder
     */
    renderJSON2XML(index, item, data, builder) {
        if (index === 0) {
            builder.addSound(builder.PATTERN_A, 1);
        }
        builder.addTextRotate(true);
        builder.addTextLang(this.LANG_JAPANESE);
        builder.addTextFont(builder.FONT_B);
        builder.addTextDouble(true, true);
        this.renderTopping(item.toppingItems, builder);
        this.renderCustom(item, builder);
        this.renderMainItemName(item.itemName, item.itemNameKitchen && item.itemNameKitchen != 'null' ? item.itemNameKitchen : '', item.quantity, builder);
        this.renderHeader(item, data, builder);
        builder.addFeedLine(1); // important - feed for cut
        // clear printer setup rotate
        builder.addTextRotate(false);
        builder.addCut(builder.CUT_FEED);
    }
    /**
     *
     * @param listTopping
     * @param builder
     */
    renderTopping(listTopping, builder) {
        let toppings = listTopping.reverse();
        for (const topping of toppings) {
            let toppingName = '  + ' + topping.itemName.replace(/&/g, '＆');
            if (topping.itemNameKitchen && topping.itemNameKitchen != 'null') {
                toppingName = '  + ' + topping.itemNameKitchen.replace(/&/g, '＆');
            }
            this.renderItemNameWithQuantity(toppingName, topping.quantity, builder);
        }
    }
    /**
     *
     * @param item
     * @param builder
     */
    renderCustom(item, builder) {
        if (item.itemDrillDownName) {
            let customName = '  - ' + item.itemDrillDownName.replace(/&/g, '＆');
            if (item.itemDrillDownNameKitchen && item.itemDrillDownNameKitchen != 'null') {
                customName = '  - ' + item.itemDrillDownNameKitchen.replace(/&/g, '＆');
            }
            let customBuffer = this.encodeTextWithSpacingFontBDouble(customName);
            customName = customBuffer.text;
            let split = this.splitItemNameToArray(customName);
            for (let index = split.length - 1; index >= 0; index--) {
                this.addText(builder, split[index]);
            }
        }
    }
    /**
     *
     * @param itemName
     * @param itemNameKitchen
     * @param quantity
     * @param builder
     */
    renderMainItemName(itemName, itemNameKitchen, quantity, builder) {
        let name = 'ロ ' + itemName.replace(/&/g, '＆');
        if (itemNameKitchen && itemNameKitchen != 'null') {
            name = 'ロ ' + itemNameKitchen.replace(/&/g, '＆');
        }
        this.renderItemNameWithQuantity(name, quantity, builder);
    }
    /**
     *
     * @param name
     * @param quantity
     * @param builder
     * @param isKitchenName
     */
    renderItemNameWithQuantity(name, quantity, builder) {
        let itemBuffer = this.encodeTextWithSpacingFontBDouble(name);
        let toppingLength = itemBuffer.textBytes;
        name = itemBuffer.text;
        let quantityLength = 0;
        let qty = quantity + '点';
        for (let index = 0; index < qty.length; index++) {
            quantityLength += this.lengthInUtf8Bytes(qty[index]) == this.HALF_WIDTH ? 1 : 2;
        }
        let remainder = toppingLength % this.MAX_WIDTH_BYTES_FONT_B_DOUBLE;
        if (remainder < this.MAX_WIDTH_BYTES_FONT_B_DOUBLE - quantityLength && remainder > 0) {
            for (let i = 0; i < (this.MAX_WIDTH_BYTES_FONT_B_DOUBLE - quantityLength) - remainder; i++) {
                name += ' ';
            }
            name += qty;
            let split = this.splitItemNameToArray(name, this.MAX_WIDTH_BYTES_FONT_B_DOUBLE);
            for (let index = split.length - 1; index >= 0; index--) {
                this.addText(builder, split[index]);
            }
        }
        else {
            let qtyText = '';
            for (let i = 0; i < (this.MAX_WIDTH_BYTES_FONT_B_DOUBLE - quantityLength); i++) {
                qtyText += ' ';
            }
            qtyText += qty;
            this.addText(builder, qtyText);
            let split = this.splitItemNameToArray(name, this.MAX_WIDTH_BYTES_FONT_B_DOUBLE);
            for (let index = split.length - 1; index >= 0; index--) {
                this.addText(builder, split[index]);
            }
        }
    }
    /**
     *
     * @param data
     */
    setKitchenPrinterPort(data) {
        const listItem = [];
        for (const item of data.listItems) {
            for (const key in this.printerPortKey) {
                const dataItem = Object.assign({}, item);
                let portIp = '';
                let printer1 = null;
                if (Object.prototype.hasOwnProperty.call(dataItem, key)) {
                    portIp = dataItem[key];
                }
                else {
                    portIp = '';
                }
                const condition = dataItem[this.printerPortKey[key]] === '' || dataItem[this.printerPortKey[key]] === 'null' || !dataItem[this.printerPortKey[key]]
                    || dataItem[this.printerDeviceKey[key]] === '' || dataItem[this.printerDeviceKey[key]] === 'null' || !dataItem[this.printerDeviceKey[key]];
                if (Object.prototype.hasOwnProperty.call(data, 'ipPrinter') && data['ipPrinter'] != '' && (portIp != '' && portIp != 'null')) {
                    printer1 = true;
                }
                else if (condition) {
                    printer1 = false;
                }
                else {
                    printer1 = true;
                }
                if (printer1) {
                    dataItem.portPrinter = portIp;
                    dataItem.localIPPrinter = dataItem[this.printerPortKey[key]];
                    dataItem.printerGroupId = dataItem[this.printerPortKey[key]];
                    dataItem.localDeviceId = dataItem[this.printerDeviceKey[key]];
                    listItem.push(dataItem);
                }
            }
        }
        return this.groupByData(listItem);
    }
    /**
     *
     * @param item
     * @param data
     * @param builder
     */
    renderHeader(item, data, builder) {
        builder.addTextSize(1, 1);
        builder.addTextFont(builder.FONT_A);
        this.renderOrderDetailNo(item, data, builder);
        this.renderOrderDatetime(data, builder);
        this.renderTableName(data, builder);
        builder.addFeedLine(1);
        this.renderHeaderTitle(builder, data.isFirstOrder, '新規注文', this.IS_ROTATE);
    }
    /**
     *
     * @param builder
     * @param isFirstOrder
     * @param textHeader
     * @param isRotate
     */
    renderHeaderTitle(builder, isFirstOrder, textHeader, isRotate = false) {
        if (isFirstOrder === 'true' || isFirstOrder === true) {
            this.addPrintHeader(builder, textHeader, isRotate);
        }
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderTableName(data, builder) {
        builder.addTextDouble(true, true);
        let tableName = 'テーブル : ';
        if (data.tableName && data.tableName !== 'null' && data.tableName !== 'undefined') {
            tableName += data.tableName.replace(/&/g, '＆');
        }
        builder.addText(tableName);
    }
    /**
     *
     * @param data
     * @param builder
     */
    renderOrderDatetime(data, builder) {
        let staffName = this.getStaffName(data);
        let staffNameLength = this.getTextByteLength(staffName);
        let date = this.alignTextRight(data.datetime, this.MAX_WIDTH_BYTES_FONT_A - staffNameLength);
        this.addText(builder, staffName + date);
    }
    /**
     *
     * @param item
     * @param data
     * @param builder
     */
    renderOrderDetailNo(item, data, builder) {
        let orderDetail = '注文番号：';
        if (item.orderDetailNo && item.orderDetailNo !== 'null' && item.orderDetailNo !== 'undefined') {
            orderDetail += item.orderDetailNo;
        }
        let orderDetailLength = this.getTextByteLength(orderDetail);
        let orderDetailNum = this.alignTextRight(data.numCustomers + '人', this.MAX_WIDTH_BYTES_FONT_A - orderDetailLength);
        this.addText(builder, orderDetail + orderDetailNum);
    }
    /**
     *
     * @param data
     */
    groupByData(data) {
        return _.mapValues(_.groupBy(data, 'printerGroupId'), clist => clist.map(items => _.omit(items, 'printerGroupId')));
    }
}
exports.PrintKitchenService = PrintKitchenService;
//# sourceMappingURL=print-kitchen.js.map