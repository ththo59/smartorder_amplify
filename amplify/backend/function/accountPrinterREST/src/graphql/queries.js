module.exports = {
    listAccountPrinters: /* GraphQL */ `
    query listAccountPrinters($companyName:String, $filter: ModelAccountPrinterFilterInput, $limit: Int, $nextToken: String){
        listAccountPrinters(companyName:$companyName, filter: $filter, limit: $limit, nextToken: $nextToken){
            items{
              companyName
              companyCode
              createdAt
              id
              printerSerialNo
              licenseEndDate
              updatedAt
            }
            nextToken
  }
} 
`
}