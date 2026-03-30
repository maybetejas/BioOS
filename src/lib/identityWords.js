const IDENTITY_WORDS = [
  { word: "Relentless", meaning: "Refusing to give up." },
  { word: "Locked In", meaning: "Fully committed to the next move." },
  { word: "Focused", meaning: "Attention directed where it matters." },
  { word: "Precise", meaning: "Clear actions with little wasted motion." },
  { word: "Consistent", meaning: "Showing up again without drama." },
  { word: "Unshaken", meaning: "Steady even under pressure." },
  { word: "Disciplined", meaning: "Choosing the long game over comfort." },
  { word: "Deliberate", meaning: "Moving with intention, not impulse." }
]

export function getIdentityWordOfTheDay(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  const index = ((dayNumber % IDENTITY_WORDS.length) + IDENTITY_WORDS.length) % IDENTITY_WORDS.length

  return IDENTITY_WORDS[index]
}
