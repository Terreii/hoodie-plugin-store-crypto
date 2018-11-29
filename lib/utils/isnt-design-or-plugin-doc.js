// Checks for a design or hoodiePluginCryptoStore/ doc,
// so we can filters out docs that shouldn't return in *All methods
module.exports = isntDesignOrPluginSettingsDoc

function isntDesignOrPluginSettingsDoc (row) {
  return (/^_design/.test(row.id) || /^hoodiePluginCryptoStore\//.test(row.id)) !== true
}
