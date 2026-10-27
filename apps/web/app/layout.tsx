import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Scenquira | Live Director', description: 'A local production assistant that keeps the streamer in control.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
