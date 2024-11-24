const crypto = require("crypto");

function validateAddress(req, res, next) {
  let address = req.body.address || req.params.address || req.query.address;

  // Check if this is a guest user request
  if (address?.startsWith("guest_")) {
    // Check for existing guest ID in cookies
    const existingGuestId = req.cookies.guestId;

    if (existingGuestId) {
      // Use existing guest ID
      address = existingGuestId;
    } else {
      // Generate new guest ID and set cookie
      address = `guest_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      res.cookie("guestId", address, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
  }

  console.log(`Auth- Address from fn vA: ${address}`);

  if (!address) {
    return res.status(400).json({ error: "Something went wrong..." });
  }

  req.playerAddress = address;
  req.isGuest = address.startsWith("guest_");
  next();
}

module.exports = { validateAddress };
