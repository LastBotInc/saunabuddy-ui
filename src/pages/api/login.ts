import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { setCookie, getCookie } from "cookies-next";
import { isValidEmail } from "./../../lib/util";

const JWT_SECRET = process.env.JWT_SECRET as string;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    // Check if token exists in the cookie
    const existingToken = getCookie("token", { req, res });

    if (existingToken) {
      try {
        // Verify the existing token
        const decoded = jwt.verify(existingToken as string, JWT_SECRET);
        const emailFromToken = (decoded as { email: string }).email;
        return res
          .status(200)
          .json({ message: "Already logged in", email: emailFromToken });
      } catch (err) {
        return res
          .status(401)
          .json({ message: "Invalid token, please log in again" });
      }
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const validPasswords = process.env.NEXT_PUBLIC_HOMEPAGE_PASSWORDS
      ? process.env.NEXT_PUBLIC_HOMEPAGE_PASSWORDS.split(",")
      : [];

    if (validPasswords.includes(password)) {
      // Create a JWT token
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });

      // Set token in a cookie
      setCookie("token", token, {
        req,
        res,
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
