import { prisma } from "../../config/prisma";
import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import config from "../../config/config";

dotenv.config();

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN: string | number = config.jwtExpiresIn;
const signToken = (id: string): string => {
  const secret = JWT_SECRET as string;
  return jwt.sign({ id: id.toString() }, secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};
export class AuthService {
  static async signup(email: string, password: string, name?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: { email, passwordHash: hashedPassword, name },
    });

    const token = signToken(newUser.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        passwordHash: newUser.passwordHash,
      },
      token,
    };
  }

  static async login(email: string, password: string) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || "");
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
    const token = signToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  static async findOrCreateOAuthUser(email: string, name?: string) {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user for OAuth login (no password)
      user = await prisma.user.create({
        data: { email, name, passwordHash: null },
      });
    }

    const token = signToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }
}
