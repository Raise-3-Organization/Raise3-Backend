const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");

// only number
const generateOTP = (length = 4) => {
  const otp = otpGenerator.generate(length, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};

const generateToken = (id, email, expiresIn = "2d") => {
  try {
    // Convert id to string if it's an ObjectId
    const userId = id.toString();

    console.log("Creating token with:", { userId, email });

    const payload = {
      user: {
        userId,
        email,
      },
    };

    console.log("Token payload:", JSON.stringify(payload));

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
    });

    // Verify token immediately (for debugging)
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Verification successful:", verified);

    return token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw error;
  }
};

const generateTempToken = (id, email, expiresIn = "30m") => {
  try {
    // Convert id to string if it's an ObjectId
    const userId = id.toString();

    console.log("Creating token with:", { userId, email });

    const payload = {
      user: {
        userId,
        email,
      },
    };

    console.log("Token payload:", JSON.stringify(payload));

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
    });

    // Verify token immediately (for debugging)
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Verification successful:", verified);

    return token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw error;
  }
};

const generateRefreshToken = (id, expiresIn = "10d") => {
  const payload = { user: id };
  const token = jwt.sign(payload, process.env.REFRESH_TOKEN, {
    expiresIn,
  });
  return token;
};

const resetPasswordToken = (id, expiresIn = "2m") => {
  const payload = {
    user: { id },
  };
  const token = jwt.sign(payload, process.env.RESET_PASSWORD, {
    expiresIn,
  });
  return token;
};

const decodeToken = (token, secret) => {
  try {
    console.log("Incoming token:", token);
    console.log("Secret key exists:", !!secret);
    console.log("Secret key length:", secret?.length);

    if (!token) {
      return { error: "Token is missing", user: null };
    }

    if (!secret) {
      return { error: "JWT_SECRET is missing", user: null };
    }

    // Try to verify the token
    const decoded = jwt.verify(token, secret);
    console.log("Successfully decoded token:", decoded);

    // Check the structure of the decoded token
    if (!decoded || !decoded.user) {
      return { error: "Invalid token structure", user: null };
    }

    return { user: decoded.user, error: null };
  } catch (error) {
    console.log("Token decode error:", error.message);
    return { error: error.message, user: null };
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = await User.findById(decoded.id).select("-password"); // Attach user to req
    if (!req.user) {
      return res.status(401).json({ error: "User not found" });
    }

    next(); // Move to next middleware or controller
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

module.exports = {
  generateOTP,
  generateToken,
  generateTempToken,
  decodeToken,
  generateRefreshToken,
  resetPasswordToken,
  authMiddleware,
};
