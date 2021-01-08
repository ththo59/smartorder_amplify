module.exports = {
    createOrderHistory: /* GraphQL */ `
  mutation CreateOrderHistory(
    $input: CreateOrderHistoryInput!
    $condition: ModelOrderHistoryConditionInput
  ) {
    createOrderHistory(input: $input, condition: $condition) {
      clientData
      companyCode
      companyName
      createdAt
      deleteFlg
      linkSystem
      orderData
      orderDateTime
      printData
      printJobId
      printResultData
      printResultStatus
      printStatus
      registerData
      systemType
      serverPrintType
      updatedAt
    }
  }
`
}