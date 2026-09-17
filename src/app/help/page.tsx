import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/ContactForm";

const faqs = [
  {
    q: "How do I join a game?",
    a: "Go to My games and choose Browse & join games. Any competition currently open for entries will be listed there.",
  },
  {
    q: "How do I pay my entry fee?",
    a: "Payment is arranged directly with the administrator — this website never collects card or bank details. Check the game overview page for payment instructions, and use your full name as the payment reference.",
  },
  {
    q: "What happens if I miss the deadline?",
    a: "Depending on the game's rules, a default team may be automatically assigned to you, or you may be eliminated. Check the Game rules page for the specific game.",
  },
  {
    q: "Can I change my selection?",
    a: "Only if the game's rules allow it, and only before the deadline. Once the deadline passes, selections are locked.",
  },
  {
    q: "What is a re-buy?",
    a: "Some games allow eliminated participants to pay again to re-enter the competition, subject to administrator approval and the rules for that game.",
  },
];

export default async function HelpPage() {
  const user = await requireUser();
  const games = user.role === "CUSTOMER"
    ? (await prisma.entry.findMany({ where: { userId: user.id }, include: { game: true } })).map((e) => ({ id: e.gameId, name: e.game.name }))
    : [];

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="page-title mb-4">Help</h1>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="card">
              <p className="font-semibold">{f.q}</p>
              <p className="text-sm text-gray-600 mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="page-title mb-4">Contact administrator</h2>
        <ContactForm games={games} />
      </div>
    </div>
  );
}
