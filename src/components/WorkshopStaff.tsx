import React, { useState } from 'react';

interface Employee {
    id: string;
    employeeId: string;
    fullName: string;
    startDate: string;
    jobTitle: string;
    certifications: {
        name: string;
        type: 'pdf' | 'doc' | 'image';
        url: string;
    }[];
}

const DUMMY_STAFF: Employee[] = [
    {
        id: '1',
        employeeId: 'WS-001',
        fullName: 'John Smith',
        startDate: '2023-01-15',
        jobTitle: 'Senior Mechanic',
        certifications: [
            { name: 'ASE Master Tech', type: 'pdf', url: '#' },
            { name: 'Safety Cert', type: 'image', url: '#' }
        ]
    },
    {
        id: '2',
        employeeId: 'WS-002',
        fullName: 'Sarah Johnson',
        startDate: '2023-03-20',
        jobTitle: 'Diagnostic Specialist',
        certifications: [
            { name: 'Electrical Systems', type: 'pdf', url: '#' }
        ]
    },
    {
        id: '3',
        employeeId: 'WS-003',
        fullName: 'Mike Wilson',
        startDate: '2023-06-10',
        jobTitle: 'Junior Technician',
        certifications: [
            { name: 'Apprentice License', type: 'pdf', url: '#' }
        ]
    },
    {
        id: '4',
        employeeId: 'WS-004',
        fullName: 'David Brown',
        startDate: '2022-11-05',
        jobTitle: 'Workshop Supervisor',
        certifications: [
            { name: 'Workshop Mgmt', type: 'pdf', url: '#' },
            { name: 'OH&S Level 3', type: 'pdf', url: '#' }
        ]
    }
];

const WorkshopStaff: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredStaff = DUMMY_STAFF.filter(employee =>
        employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Workshop Staff</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage personnel, track certifications, and oversee workshop roles.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm self-start md:self-auto"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Staff Member
                </button>
            </div>

            {/* Table Controls (Search Bar) */}
            <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search by name, ID or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Employee ID#</th>
                                <th className="px-6 py-4">Full Name</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">Job Title</th>
                                <th className="px-6 py-4 text-center">Certifications</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStaff.map((employee) => (
                                <tr key={employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                            {employee.employeeId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {employee.fullName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 dark:text-slate-400">
                                        {new Date(employee.startDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {employee.jobTitle}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {employee.certifications.map((cert, index) => (
                                                <a
                                                    key={index}
                                                    href={cert.url}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/10 hover:text-primary rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 transition-all"
                                                    title={`View ${cert.name}`}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {cert.type === 'pdf' ? 'picture_as_pdf' : cert.type === 'image' ? 'image' : 'description'}
                                                    </span>
                                                    {cert.name}
                                                </a>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-5xl mb-3 opacity-20">person_off</span>
                                        <p className="text-lg font-bold">No employees found</p>
                                        <p className="text-sm">Try adjusting your search criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkshopStaff;
