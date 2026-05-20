import { useCompany } from '../lib/CompanyProvider';

export function Footer() {
    const { company } = useCompany();

    return (
        <footer className="bg-[linear-gradient(135deg,#091f1a_0%,#143b31_52%,#0b2722_100%)] px-4 py-10 text-white">
            <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-lg font-extrabold tracking-[-0.03em] text-white">{company.name}</p>
                        <p className="mt-1 text-sm text-white/56">Court reservations, venue details, and private play scheduling.</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-sm font-medium text-white/56">Copyright {new Date().getFullYear()} {company.name}. All rights reserved.</p>
                        <p className="mt-2 text-sm text-white/42">
                            Created by <a href="https://www.facebook.com/profile.php?id=61587269647950" target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary underline decoration-secondary/30 underline-offset-4 transition-colors hover:text-white">Odyssey</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
