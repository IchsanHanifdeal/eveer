import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { useQuery } from "@tanstack/react-query";
import DayJS from "dayjs";
import "dayjs/locale/id";
import { sign, verify } from "hono/jwt";
import QuickLRU from "quick-lru";
import dotenv from "dotenv";

dotenv.config();

DayJS.locale("id");
export const dayjs = DayJS;

export const cache = new QuickLRU({ maxSize: 1000 });

export const prisma = new PrismaClient();

export const checkLengthValue = (obj, inputLength = 1, textLength = 6) => {
  if (Object.keys(obj).length != inputLength) return false;
  return Object.values(obj).every((x) => x.length > textLength - 1);
};

export const customObj = (obj, keys) =>
  keys.reduce((x, key) => {
    if (key in obj) {
      x[key] = obj[key];
    }
    return x;
  }, {});

export const stringObj = (arr) => JSON.stringify(arr);

export const validateQuery = (req, res, qs = []) => {
  if (stringObj(qs) == stringObj(Object.keys(req.query))) return false;
  return res.status(400).json({ ok: false, message: `Parameter [${qs}] cannot be empty` });
};

export const validateBody = (req, res, qs = []) => {
  if (stringObj(qs) == stringObj(Object.keys(req.body))) return false;
  return res.status(400).json({ ok: false, message: `Parameter [${qs}] cannot be empty` });
};

export const signJWT = async (payload = {}, exp = 50) => {
  try {
    return await sign({ ...payload, exp: Math.floor(Date.now() / 1000) + exp }, process.env.JWT_SECRET, "HS512");
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const verifyJWT = async (token) => {
  try {
    return await verify(token, process.env.JWT_SECRET, "HS512");
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const hashPassword = async (pass) =>
  bcrypt
    .genSalt(10)
    .then((salt) => bcrypt.hash(pass, salt))
    .catch(() => false);

export const comparePassword = async (pass, hash) =>
  bcrypt
    .compare(pass, hash)
    .catch(() => false);

export const toRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(value));

export const fetchJson = async (uri, method) => await fetch(uri).then((x) => x.json());

export const postJson = async (uri, data) =>
  await fetch(uri, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  }).then((x) => x.json());

export const toLocalISOString = (date) => {
  const lokal = new Date(date - date.getTimezoneOffset() * 60000);
  lokal.setSeconds(null);
  lokal.setMilliseconds(null);
  return lokal.toISOString().slice(0, -1);
};

export const queryDatabase = async (model, method, params) => {
  try {
    const result = await prisma[model][method](params);
    return result;
  } catch (err) {
    console.error("Database query error:", err);
    return false;
  }
};
export const useQFetchFn = (fn, key, opts) =>
  useQuery({
    queryKey: key,
    queryFn: fn,
    refetchInterval: 10000,
    refetchOnReconnect: true,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
    ...opts,
  });