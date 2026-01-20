import { pool } from "./db.js";

// קבלת כל הקרדיטים
export async function getCreditsList() {
  const [rows] = await pool.query("SELECT id, nick, profile FROM footer_credits");
  return rows;
}

// הוספת קרדיט
export async function addCredit(nick, profile) {
  await pool.query(
    "INSERT INTO footer_credits (nick, profile) VALUES (?, ?)",
    [nick, profile]
  );
}

// עדכון קרדיט
export async function updateCredit(id, nick, profile) {
  await pool.query(
    "UPDATE footer_credits SET nick = ?, profile = ? WHERE id = ?",
    [nick, profile, id]
  );
}

// הסרת קרדיט
export async function removeCredit(id) {
  await pool.query("DELETE FROM footer_credits WHERE id = ?", [id]);
}
