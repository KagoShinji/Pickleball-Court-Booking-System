import { useCompany } from '../lib/CompanyProvider';

export function Footer() {
    const { company } = useCompany();
    const brand = company.shortName || company.name;

    return (
        <footer className="sport-footer relative min-h-[38dvh] px-5 py-12 text-primary-dark sm:px-8 lg:px-12 xl:px-14">
            <p className="pointer-events-none absolute bottom-[-1.4rem] left-4 hidden select-none font-condensed text-[clamp(5rem,15vw,16rem)] uppercase leading-none text-primary-dark/[0.045] sm:block lg:left-12">
                {brand}
            </p>
            <div className="mx-auto flex min-h-[26dvh] max-w-[1540px] flex-col justify-between rounded-[0.65rem] border border-primary-dark/10 bg-white/62 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_34px_100px_-76px_rgba(9,31,26,0.58)] sm:p-8 lg:p-9">
                <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-secondary">Ready when you are</p>
                    <h2 className="max-w-3xl font-condensed text-[clamp(3.8rem,6.5vw,7.2rem)] uppercase leading-[0.78] tracking-normal text-primary-dark lg:justify-self-end lg:text-right">
                        Book the next rally.
                    </h2>
                </div>

                <div className="mt-10 flex flex-col gap-6 border-t border-primary-dark/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-lg font-extrabold tracking-[-0.03em] text-primary-dark">{company.name}</p>
                        <p className="mt-1 text-sm text-primary-dark/56">Court reservations, venue details, and private play scheduling.</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-sm font-medium text-primary-dark/56">Copyright {new Date().getFullYear()} {company.name}. All rights reserved.</p>
                        <p className="mt-2 text-sm text-primary-dark/42">
                            Created by <a href="https://www.facebook.com/profile.php?id=61587269647950" target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary underline decoration-secondary/30 underline-offset-4 transition-colors hover:text-primary-dark">Odyssey</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
