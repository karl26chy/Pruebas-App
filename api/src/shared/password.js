import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export const hash = (plain) => bcrypt.hash(String(plain), ROUNDS);

export const compare = (plain, hashed) => bcrypt.compare(plain, hashed);
