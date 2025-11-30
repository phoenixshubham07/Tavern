import { getSharedNote, remixNote } from '@/app/inkflow/actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Copy, ArrowLeft } from 'lucide-react';

export default async function SharedNotePage({ params }: { params: { token: string } }) {
  const { token } = await params;
  const result = await getSharedNote(token);

  if (result.error || !result.note) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <h1 className="text-2xl text-red-500 mb-4">Note not found</h1>
        <p className="text-gray-400">This link might be invalid or the note is private.</p>
        <Link href="/" className="mt-8 text-accent-blue hover:underline">Return Home</Link>
      </div>
    );
  }

  const { note, ownerUsername } = result;

  async function handleRemix() {
    'use server';
    const response = await remixNote(note.id);
    if (response.success) {
      redirect('/inkflow');
    } else {
      // In a real app, we'd handle error UI better, but for MVP redirect with error param or similar
      console.error("Remix failed");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center text-gray-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Tavern
        </Link>

        {/* Attribution Badge */}
        <div className="flex items-center justify-between mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-bold text-lg">
              {ownerUsername[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-400">Shared by</p>
              <p className="text-lg font-bold text-white">@{ownerUsername}</p>
            </div>
          </div>
          
          <form action={handleRemix}>
            <button 
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-navy-blue rounded-lg font-bold hover:bg-white transition-all"
            >
              <Copy size={18} />
              Remix this Note
            </button>
          </form>
        </div>

        {/* Note Content */}
        <article className="prose prose-invert max-w-none p-8 bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
           {/* We render raw markdown for now, or could use a markdown renderer if available. 
               Since the editor uses a textarea, let's display it as pre-wrap text or simple markdown.
               For MVP, whitespace-pre-wrap is safest to preserve structure without a heavy lib. */}
           <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-gray-200">
             {note.content_text}
           </div>
        </article>
      </div>
    </div>
  );
}
