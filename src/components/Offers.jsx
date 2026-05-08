import { Armchair, Car, DoorOpen, Volleyball, Gamepad2, ShowerHead, Wifi, Coffee, Music, TreePine, CheckCircle2 } from 'lucide-react';
import { useCompany } from '../lib/CompanyProvider';

const ICONS = {
    'shower': <ShowerHead size={32} />,
    'toilet': <ShowerHead size={32} />,
    'lounge': <Armchair size={32} />,
    'parking': <Car size={32} />,
    'pingpong': <Volleyball size={32} />,
    'billiards': <Gamepad2 size={32} />,
    'door': <DoorOpen size={32} />,
    'wifi': <Wifi size={32} />,
    'coffee': <Coffee size={32} />,
    'music': <Music size={32} />,
    'outdoor': <TreePine size={32} />,
};

const AMENITY_TITLES = {
    'shower': 'Toilet & Changing Room',
    'toilet': 'Restroom',
    'lounge': 'Lounge Area',
    'parking': 'Parking',
    'pingpong': 'Ping Pong',
    'billiards': 'Billiards',
    'door': 'Indoor Court',
    'wifi': 'Free Wi-Fi',
    'coffee': 'Coffee Shop',
    'music': 'Music System',
    'outdoor': 'Outdoor Court',
};

export function Offers() {
    const { company } = useCompany();
    
    const amenities = company.amenities && company.amenities.length > 0 
        ? company.amenities 
        : ['shower', 'lounge', 'parking', 'pingpong', 'billiards'];

    return (
        <section id="offers" className="py-24 bg-bg-user relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary-dark mb-4">
                        What This Place Offers
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Enjoy premium amenities designed for your comfort and entertainment before and after your game.
                    </p>
                </div>

                {/* Amenities Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {amenities.map(key => {
                        const icon = ICONS[key] || <Armchair size={32} />;
                        const title = AMENITY_TITLES[key] || key;
                        return <AmenityCard key={key} icon={icon} title={title} />;
                    })}
                </div>
            </div>
        </section>
    );
}

function AmenityCard({ icon, title }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow duration-300 group">
            <div className="w-16 h-16 rounded-full bg-primary-light text-primary-dark flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <span className="font-medium text-gray-700">{title}</span>
        </div>
    );
}
