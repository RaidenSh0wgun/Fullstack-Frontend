import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ActivityData {
    id: number;
    title: string;
    description: string;
    created_at: string;
}

export default function Homepage() {
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/activities/');
            setActivities(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch activities');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">OQES Activities</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {error && <div className="text-red-600 mb-4">{error}</div>}
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activities.map((activity) => (
                        <div key={activity.id} className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-2">{activity.title}</h2>
                            <p className="text-gray-600 mb-4">{activity.description}</p>
                            <p className="text-sm text-gray-400">
                                {new Date(activity.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}