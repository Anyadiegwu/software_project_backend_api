// const User = require("../models/User");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const TokenBlacklist = require("../models/TokenBlacklist");
// const crypto = require("crypto");
// const AuditLog = require("../models/AuditLog");
// const transporter = require("../config/mailer");


// const generateOTP = () => {
//   return crypto.randomInt(100000, 999999).toString();
// };
// // ========================
// // REPORTER REGISTER
// // ========================
// exports.reporterRegister = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required"
//       });
//     }

//     // check if user exists
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.status(400).json({
//         message: "User already exists"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       role: "reporter"
//     });
//     const otp = generateOTP();

//     user.otp = otp;
//     user.otpExpires = Date.now() + 10 * 60 * 1000;

//     await user.save();

//     const transporter = require("../config/mailer");

//     try {
//       await transporter.sendMail({
//         to: user.email,
//         subject: "Verify your account",
//         text: `Your OTP is ${otp}`
//       });
//     } catch (mailErr) {
//       console.error("Email send failed:", mailErr.message);

//     }

//     res.status(201).json({
//       message: "User created. Check email for OTP verification (or use resend-otp if not received)",
//       user
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// // ========================
// // REPORTER LOGIN
// // ========================
// exports.reporterLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({
//       email: email?.toLowerCase(),
//       role: "reporter"
//     });

//     if (!user) {
//       return res.status(400).json({
//         message: "Invalid credentials"
//       });
//     }
//     if (!user.isVerified) {
//       return res.status(403).json({
//         message: "Please verify your email first"
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Invalid credentials"
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );
//     await AuditLog.create({
//       actor: user._id,
//       action: "LOGIN_SUCCESS",
//       ip: req.ip
//     });

//     res.json({
//       message: "Login successful",
//       token,
//       user
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// // ========================
// // SECURITY REGISTER
// // ========================
// exports.securityRegister = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       badgeNumber,
//       department,
//       rank,
//       password
//     } = req.body;

//     if (!email && !badgeNumber) {
//       return res.status(400).json({
//         message: "Email or badge number is required"
//       });
//     }

//     // check duplicates
//     const existingUser = await User.findOne({
//       $or: [
//         email ? { email: email.toLowerCase() } : null,
//         badgeNumber ? { badgeNumber } : null
//       ].filter(Boolean)
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         message: "User already exists"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email: email ? email.toLowerCase() : undefined,
//       badgeNumber,
//       department,
//       rank,
//       password: hashedPassword,
//       role: "security",
//       isApproved: false
//     });

//     const otp = generateOTP();

//     user.otp = otp;
//     user.otpExpires = Date.now() + 10 * 60 * 1000;

//     await user.save();

//     const transporter = require("../config/mailer");


//     try {
//       await transporter.sendMail({
//         to: user.email,
//         subject: "Verify your account",
//         text: `Your OTP is ${otp}`
//       });
//     } catch (mailErr) {
//       console.error("Email send failed:", mailErr.message);
//       // Still return success — user is created, OTP is saved
//       // They can use /resend-otp to get a new one
//     }

//     res.status(201).json({
//       message: "User created. Check email for OTP verification (or use resend-otp if not received)",
//       user
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// // ========================
// // SECURITY LOGIN
// // ========================
// exports.securityLogin = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;

//     if (!identifier || !password) {
//       return res.status(400).json({
//         message: "Identifier and password are required"
//       });
//     }

//     const normalizedIdentifier = identifier.trim().toLowerCase();

//     const user = await User.findOne({
//       role: "security",
//       $or: [
//         { email: normalizedIdentifier },
//         { badgeNumber: identifier.trim() }
//       ]
//     });

//     if (!user) {
//       return res.status(400).json({
//         message: "Invalid credentials (user not found)"
//       });
//     }

//     if (!user.isApproved) {
//       return res.status(403).json({
//         message: "Account not approved by admin yet"
//       });
//     }

//     if (!user.isVerified) {
//       return res.status(403).json({
//         message: "Please verify your email first"
//       });
//     }
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Invalid credentials (password mismatch)"
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     await AuditLog.create({
//       actor: user._id,
//       action: "LOGIN_SUCCESS",
//       ip: req.ip
//     });

//     res.json({
//       message: "Login successful",
//       token,
//       user
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.adminRegister = async (req, res) => {
//   try {
//     const { name, email, password, adminSecret } = req.body;

//     // 🔒 Check secret
//     if (adminSecret !== process.env.ADMIN_SECRET) {
//       return res.status(403).json({
//         message: "Not authorized to create admin"
//       });
//     }

//     const existingAdmin = await User.findOne({ email });

//     if (existingAdmin) {
//       return res.status(400).json({
//         message: "Admin already exists"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const admin = await User.create({
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       role: "admin",
//       isVerified: true
//     });

//     res.status(201).json({
//       message: "Admin created successfully",
//       admin
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({
//       email: email.toLowerCase(),
//       role: "admin"
//     });

//     if (!user) {
//       return res.status(400).json({
//         message: "Invalid admin credentials"
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Invalid admin credentials"
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.json({
//       message: "Admin login successful",
//       token,
//       user
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     if (
//       user.otp !== otp ||
//       user.otpExpires < Date.now()
//     ) {
//       return res.status(400).json({
//         message: "Invalid or expired OTP"
//       });
//     }

//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpires = undefined;

//     await user.save();

//     res.json({ message: "Account verified successfully" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.logout = async (req, res) => {
//   const token = req.headers.authorization.split("")[1];

//   await TokenBlacklist.create({
//     token,
//     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//   });

//   res.json({ message: "Logged out" });
// };

// exports.requestPasswordReset = async (req, res) => {
//   const { email } = req.body;

//   const user = await User.findOne({ email });

//   if (!user) {
//     return res.json({ message: "If user exists, email sent" });
//   }

//   const token = crypto.randomBytes(32).toString("hex");

//   user.resetToken = token;
//   user.resetTokenExpires = Date.now() + 10 * 60 * 1000;

//   await user.save();

//   const transporter = require("../config/mailer");

//   await transporter.sendMail({
//     to: email,
//     subject: "Password Reset",
//     text: `Use this token: ${token}`
//   });

//   res.json({ message: "Reset email sent" });
// };

// exports.resetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;

//   const user = await User.findOne({
//     resetToken: token,
//     resetTokenExpires: { $gt: Date.now() }
//   });

//   if (!user) {
//     return res.status(400).json({
//       message: "Invalid or expired token"
//     });
//   }

//   user.password = await bcrypt.hash(newPassword, 10);

//   user.resetToken = undefined;
//   user.resetTokenExpires = undefined;

//   await user.save();

//   res.json({ message: "Password reset successful" });
// };

// exports.requestOTP = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     user.otp = otp;
//     user.otpExpires = Date.now() + 10 * 60 * 1000;

//     await user.save();

//     await transporter.sendMail({
//       to: user.email,
//       subject: "OTP Verification Code",
//       text: `Your OTP is: ${otp}`
//     });

//     res.json({ message: "OTP sent successfully" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/TokenBlacklist");
const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");
const transporter = require("../config/mailer");


const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ========================
// REPORTER REGISTER
// ========================
exports.reporterRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "reporter"
    });

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    try {
      await transporter.sendMail({
        to: user.email,
        subject: "Verify your account",
        text: `Your OTP is ${otp}`
      });
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
    }

    res.status(201).json({
      message: "User created. Check email for OTP verification (or use resend-otp if not received)",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// REPORTER LOGIN
// ========================
exports.reporterLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email?.toLowerCase(),
      role: "reporter"
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await AuditLog.create({
      actor: user._id,
      action: "LOGIN_SUCCESS",
      ip: req.ip
    });

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// SECURITY REGISTER
// ========================
exports.securityRegister = async (req, res) => {
  try {
    const { name, email, badgeNumber, department, rank, password } = req.body;

    if (!email && !badgeNumber) {
      return res.status(400).json({
        message: "Email or badge number is required"
      });
    }

    const existingUser = await User.findOne({
      $or: [
        email ? { email: email.toLowerCase() } : null,
        badgeNumber ? { badgeNumber } : null
      ].filter(Boolean)
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      badgeNumber,
      department,
      rank,
      password: hashedPassword,
      role: "security",
      isApproved: false
    });

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // try {
    //   await transporter.sendMail({
    //     to: user.email,
    //     subject: "Verify your account",
    //     text: `Your OTP is ${otp}`
    //   });
    // } catch (mailErr) {
    //   console.error("Email send failed:", mailErr.message);
    // }

    res.status(201).json({
      message: "User created. Check email for OTP verification (or use resend-otp if not received)",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// SECURITY LOGIN
// ========================
exports.securityLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required"
      });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      role: "security",
      $or: [
        { email: normalizedIdentifier },
        { badgeNumber: identifier.trim() }
      ]
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials (user not found)"
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        message: "Account not approved by admin yet"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials (password mismatch)"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await AuditLog.create({
      actor: user._id,
      action: "LOGIN_SUCCESS",
      ip: req.ip
    });

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// ADMIN REGISTER
// ========================
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        message: "Not authorized to create admin"
      });
    }

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// ADMIN LOGIN
// ========================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: "admin"
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid admin credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid admin credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Admin login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// VERIFY OTP
// ========================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP"
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "Account verified successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// LOGOUT  — BUG FIX: was split("")[1], must be split(" ")[1]
// ========================
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "No token provided" });
    }

    // ✅ Fixed: split(" ") not split("")
    const token = authHeader.split(" ")[1];

    await TokenBlacklist.create({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// REQUEST PASSWORD RESET
// ========================
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "If user exists, email sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      text: `Use this token: ${token}`
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// RESET PASSWORD
// ========================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ========================
// RESEND OTP
// ========================
exports.requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      to: user.email,
      subject: "OTP Verification Code",
      text: `Your OTP is: ${otp}`
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};