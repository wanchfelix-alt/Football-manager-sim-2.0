// game/relationships.js — relationship meter management, dating/marriage flow
import { clamp, rand } from "./state.js";

export function decayRelationships(char) {
  char.relationships.forEach(r => {
    if (!r.alive) return;
    const decay = r.type === "partner" ? 3 : r.type === "parent" ? 4 : 6;
    r.meter = clamp(r.meter - decay, 0, 100);
  });
}

export function addRelationship(char, type, name, occupation) {
  const id = `${type}_${Date.now()}_${rand(0, 9999)}`;
  const rel = { id, name, type, meter: rand(40, 70), alive: true, occupation };
  char.relationships.push(rel);
  return rel;
}

export function adjustAllRelationships(char, type, amount) {
  char.relationships.filter(r => r.type === type && r.alive).forEach(r => {
    r.meter = clamp(r.meter + amount, 0, 100);
  });
}

export function interact(char, relId, action) {
  const rel = char.relationships.find(r => r.id === relId);
  if (!rel) return null;
  const effects = {
    apologize: 8, argue: -10, gift: 12, spend_time: 6, compliment: 5
  };
  const delta = effects[action] ?? 0;
  rel.meter = clamp(rel.meter + delta, 0, 100);
  if (action === "gift") char.money -= rand(20, 150);
  return rel;
}

export function tryDate(char) {
  if (char.age < 16) return { success: false, reason: "Too young to date." };
  const compatibility = rand(20, 90);
  if (compatibility > 45) {
    const partner = addRelationship(char, "partner", `${char.sex === "M" ? "Girlfriend" : "Boyfriend"}`);
    partner.meter = compatibility;
    return { success: true, partner };
  }
  return { success: false, reason: "Didn't hit it off." };
}

export function tryMarry(char) {
  const partner = char.relationships.find(r => r.type === "partner" && r.alive);
  if (!partner) return { success: false, reason: "No partner to marry." };
  if (partner.meter < 60) return { success: false, reason: "Relationship isn't strong enough." };
  partner.type = "spouse";
  return { success: true };
}

export function haveChild(char, method = "birth") {
  if (char.age < 18) return { success: false, reason: "Too young." };
  const child = addRelationship(char, "child", method === "adoption" ? "Adopted Child" : "Newborn");
  child.meter = 70;
  return { success: true, child };
}
