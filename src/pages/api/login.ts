import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    const validPasswords = process.env.NEXT_PUBLIC_HOMEPAGE_PASSWORDS
      ? process.env.NEXT_PUBLIC_HOMEPAGE_PASSWORDS.split(",")
      : [];

    if (validPasswords.includes(password)) {
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
