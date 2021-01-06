module.exports = {
    createAccountPrinter: /* GraphQL */ `
    mutation CreateAccountPrinter(
        $input: CreateAccountPrinterInput!
        $condition: ModelAccountPrinterConditionInput) {
            createAccountPrinter(input: $input, condition: $condition) {
              companyName
              companyCode
              createdAt
              id
              printerSerialNo
              licenseEndDate
              updatedAt
            }
  }
`,
    updateAccountPrinter: /* GraphQL */ `
      mutation UpdateAccountPrinter(
        $input: UpdateAccountPrinterInput!
        $condition: ModelAccountPrinterConditionInput) {
            updateAccountPrinter(input: $input, condition: $condition) {
              companyName
              companyCode
              createdAt
              id
              printerSerialNo
              licenseEndDate
              updatedAt
            }
  }
`,
    deleteAccountPrinter: /* GraphQL */ `
      mutation DeleteAccountPrinter($input: DeleteAccountPrinterInput!, $condition: ModelAccountPrinterConditionInput){
        deleteAccountPrinter(input: $input, condition: $condition) {
          companyName
          companyCode
          createdAt
          id
          printerSerialNo
          licenseEndDate
          updatedAt
    }
}
`
}