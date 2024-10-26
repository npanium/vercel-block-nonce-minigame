function validateAddress(req, res, next) {
  const address = req.body.address || req.params.address || req.query.address;
  if (!address) {
    return res.status(400).json({ error: "Player address is required" });
  }
  req.playerAddress = address;
  next();
}

module.exports = { validateAddress };
