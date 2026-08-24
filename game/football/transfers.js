// game/football/transfers.js — [Innovation] buy/sell/loan with counter-offer negotiation
import { rand, clamp } from "../state.js";
import { generatePlayer } from "./squad.js";

export function generateTransferMarket(count = 8, clubPrestige = 50) {
  return Array.from({ length: count }, () => generatePlayer(clubPrestige));
}

export function negotiate(askingPrice, offer) {
  const ratio = offer / askingPrice;
  if (ratio >= 0.95) return { accepted: true, finalPrice: offer };
  if (ratio >= 0.75) {
    const counter = Math.round(askingPrice * rand(80, 92) / 100);
    return { accepted: false, counter };
  }
  return { accepted: false, rejected: true };
}

export function buyPlayer(footballState, player, price) {
  if (footballState.transferBudget < price) return { success: false, reason: "Insufficient budget." };
  footballState.transferBudget -= price;
  footballState.squad = footballState.squad || [];
  footballState.squad.push(player);
  return { success: true };
}

export function sellPlayer(footballState, playerId, price) {
  footballState.squad = (footballState.squad || []).filter(p => p.id !== playerId);
  footballState.transferBudget += price;
  return { success: true };
}
