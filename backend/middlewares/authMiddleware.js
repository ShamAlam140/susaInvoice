import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const auth = async (req, res, next) => {
  try {
    const token =
      req.headers['authorization']?.split(' ')[1] || // Bearer token
      req.body?.refreshToken ||
      req.cookies?.refreshToken ||
      req.query?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ refreshToken: token });

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token expired or invalid' });
      }

      req.userId = decoded.userId;
      next();
    });
  } catch (err) {
    res.status(500).json({ message: 'Authentication error', error: err.message });
  }
};

export default auth;
