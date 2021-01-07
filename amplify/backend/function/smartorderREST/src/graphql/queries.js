module.exports = {
    listOrderHistorys: /* GraphQL */ `
    query listOrderHistorys($companyName: ID, $filter: ModelOrderHistoryFilterInput) {
      listOrderHistorys(companyName: $companyName, filter: $filter) {
        items {
          companyCode
          companyName
          linkSystem
          orderDateTime
          printJobId
          printResultData
          printResultStatus
          printStatus
          clientData
          createdAt
          deleteFlg
          orderData
          printData
          registerData
          systemType
          updatedAt
        }
      }
}
`,
    fieldToReferenceForCompanyCodeIndex: /* GraphQL */ `
  query FieldToReferenceForCompanyCodeIndex(
    $companyName: ID
    $companyCode: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelOrderHistoryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    fieldToReferenceForCompanyCodeIndex(
      companyName: $companyName
      companyCode: $companyCode
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        companyCode
        companyName
        createdAt
        deleteFlg
        orderData
        orderDateTime
        printJobId
        printData
        printResultData
        printResultStatus
        printStatus
        updatedAt
      }
      nextToken
    }
  }
`
}