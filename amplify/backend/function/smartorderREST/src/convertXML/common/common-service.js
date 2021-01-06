"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonService = void 0;
const js2xmlparser_1 = require("js2xmlparser");
// const PAGE_MAX_WIDTH = 576;
class CommonService {
    constructor() {
        this.typeBDots = 20;
        this.typeADots = 24;
        this.ALIGN_LEFT = 'left';
        this.ALIGN_RIGHT = 'right';
        this.FONT_A = 'font_a';
        this.FONT_B = 'font_b';
        this.SIZE_1 = 1;
        this.SIZE_2 = 2;
        this.MAX_WIDTH_BYTES_FONT_A = 48; // 48 characters half-width
        this.MAX_WIDTH_BYTES_FONT_B = 57; // 57 characters half-width
        this.MAX_WIDTH_BYTES_FONT_B_DOUBLE = 28; // 28 characters half-width
        this.IS_ROTATE = true;
        this.HALF_WIDTH = 1; // half-width's width in paper
        this.FULL_WIDTH = 2; // full-width's width in paper
        this.LANG_JAPANESE = 'ja';
        this.EPSON_PRINT = '1';
        this.PRINT_TYPE_KITCHEN = '2';
    }
    /**
     * 1 is half-width
     * 3 is full-width
     * 4 is does not support
     *
     * @param str
     */
    lengthInUtf8Bytes(str) {
        if (str.match(/[\uff66-\uff9f]/)) { // half-width katakana
            return 1;
        }
        return Buffer.from(str).length;
    }
    /**
     *
     * @param current
     */
    convertJapanCurrent(current) {
        return current.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }).toString();
    }
    /**
     *
     * @param data
     */
    addPrintXMLContent(data) {
        let dataConvert = js2xmlparser_1.parse('ePOSPrint', data).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return dataConvert.replace("<?xml version='1.0'?>", '');
    }
    /**
     * @description add line header to print xml
     * @param builder
     * @param textHeader
     * @param isRotate
     */
    addPrintHeader(builder, textHeader, isRotate = false) {
        builder.addTextRotate(isRotate);
        builder.addTextAlign(builder.ALIGN_CENTER);
        builder.addTextFont(builder.FONT_A);
        builder.addTextSize(2, 2);
        builder.addTextStyle(true, false, false, builder.COLOR_1);
        builder.addTextLineSpace(20);
        builder.addText('   ' + textHeader + '   ');
        builder.addFeedLine(1);
        builder.addTextStyle(false, false, false, builder.COLOR_1);
        return builder;
    }
    /**
     * Draw a line with black color
     * DONT CHANGE VALUE - it will fail
     * @param builder
     */
    canvasDrawDashLine(builder) {
        builder.addFeedUnit(10);
        builder.message += "<image width=\"575\" height=\"3\" color=\"color_1\" mode=\"mono\">" + "///////////////////////////////////////////////////////////////////////////////////////////////+///////////////////////////////////////////////////////////////////////////////////////////////+///////////////////////////////////////////////////////////////////////////////////////////////+" + "</image>";
        builder.addFeedUnit(10);
        return builder;
    }
    /**
     * Add new substring to a string with index
     *
     * @param str
     * @param subStr
     * @param index
     * @param rem
     */
    splice(str, subStr, index, rem) {
        return str.slice(0, index) + subStr + str.slice(index + Math.abs(rem));
    }
    /**
     *
     * @param text
     * @param maxSpace
     * @param textSize
     */
    alignTextRight(text, maxSpace, textSize = 1) {
        return this.alignTextSpace(text, maxSpace, textSize, this.ALIGN_RIGHT);
    }
    /**
     *
     * @param text
     * @param maxSpace
     * @param textSize
     */
    alignTextLeft(text, maxSpace, textSize = 1) {
        return this.alignTextSpace(text, maxSpace, textSize, this.ALIGN_LEFT);
    }
    /**
     *
     * @param text
     * @param maxSpace
     * @param textSize
     * @param align
     * @private
     */
    alignTextSpace(text, maxSpace, textSize, align = this.ALIGN_LEFT) {
        let result = '';
        let length = 0;
        for (let index = 0; index < text.length; index++) {
            length += (this.lengthInUtf8Bytes(text[index]) == this.HALF_WIDTH ? 1 : 2) * textSize;
        }
        if (align === this.ALIGN_LEFT) {
            result += text;
            for (let i = 0; i < (maxSpace - length) / textSize; i++) {
                result += ' ';
            }
        }
        if (align == this.ALIGN_RIGHT) {
            for (let i = 0; i < (maxSpace - length) / textSize; i++) {
                result += ' ';
            }
            result += text;
        }
        return result;
    }
    /**
     *
     * @param text
     */
    encodeTextWithSpacingFontA(text) {
        return this.encodeTextWithSpacing(text, this.FONT_A, this.SIZE_1);
    }
    /**
     *
     * @param text
     */
    encodeTextWithSpacingFontBDouble(text) {
        return this.encodeTextWithSpacing(text, this.FONT_B, this.SIZE_2);
    }
    /**
     *
     * @param text
     * @param font
     * @param size
     */
    encodeTextWithSpacing(text, font = this.FONT_A, size = this.SIZE_1) {
        let textBytes = 0;
        let maxWidthBytes = 0;
        if (font == this.FONT_A) {
            maxWidthBytes = this.MAX_WIDTH_BYTES_FONT_A / size;
        }
        else if (font === this.FONT_B) {
            maxWidthBytes = size === this.SIZE_1 ? this.MAX_WIDTH_BYTES_FONT_B : this.MAX_WIDTH_BYTES_FONT_B_DOUBLE;
        }
        for (let index = 0; index < text.length; index++) {
            let characterLength = this.lengthInUtf8Bytes(text[index]);
            textBytes += characterLength == this.HALF_WIDTH ? 1 : 2;
            if (index > 3) {
                switch (textBytes % maxWidthBytes) {
                    case maxWidthBytes - this.FULL_WIDTH:
                        text = this.splice(text, '  ', index + 1, 0);
                        textBytes += 2;
                        index += 2;
                        break;
                    case maxWidthBytes - this.HALF_WIDTH:
                        text = this.splice(text, '   ', index, 0);
                        textBytes += 3;
                        index += 3;
                        break;
                }
            }
        }
        return { text, textBytes };
    }
    /**
     *
     * @param builder
     * @param text
     */
    addText(builder, text) {
        builder.addText(text);
        builder.addFeedLine(1);
        return builder;
    }
    /**
     * @return array split
     * @param name
     * @param maxWidth
     */
    splitItemNameToArray(name, maxWidth = this.MAX_WIDTH_BYTES_FONT_B_DOUBLE) {
        let splitText = '';
        let splitLength = 0;
        let split = [];
        for (let index = 0; index < name.length; index++) {
            splitText += name[index];
            splitLength += this.lengthInUtf8Bytes(name[index]) == this.HALF_WIDTH ? 1 : 2;
            if (splitLength % maxWidth == 0 && splitLength / maxWidth > 0 || index == name.length - 1) {
                split.push(splitText);
                splitText = '';
            }
        }
        return split;
    }
    /**
     *
     * @param text
     */
    getTextByteLength(text) {
        let length = 0;
        for (let index = 0; index < text.length; index++) {
            length += this.lengthInUtf8Bytes(text[index]) == this.HALF_WIDTH ? 1 : 2;
        }
        return length;
    }
    /**
     *
     * @param data
     */
    getStaffName(data) {
        let staffName = 'スタッフ：';
        if (data.staffName && data.staffName !== 'null' && data.staffName !== 'undefined') {
            staffName += data.staffName.replace(/&/g, '＆');
        }
        return staffName;
    }
}
exports.CommonService = CommonService;
//# sourceMappingURL=common-service.js.map