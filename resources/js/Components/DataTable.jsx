import { Link } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Plus
} from 'lucide-react';

export default function DataTable({
    columns,
    data,
    onEdit,
    onDelete,
    onCreate,
    createLabel = "Tambah Data",
    search,
    onSearch
}) {
    const { data: rows, links, from, to, total, current_page, last_page } = data;

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Cari data..."
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-xl text-sm transition-all"
                    />
                </div>

                {onCreate && (
                    <button
                        onClick={onCreate}
                        className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {createLabel}
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                            <th className="px-6 py-4 rounded-tl-3xl">#</th>
                            {columns.map((col, index) => (
                                <th key={index} className="px-6 py-4">{col.header}</th>
                            ))}
                            <th className="px-6 py-4 text-right rounded-tr-3xl">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                        {rows.length > 0 ? (
                            rows.map((row, rowIndex) => (
                                <tr key={row.id || rowIndex} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-gray-400 font-mono">
                                        {(current_page - 1) * 10 + rowIndex + 1}
                                    </td>
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 text-gray-700">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(row)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(row)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-400">
                                    Tidak ada data ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {total > 10 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium text-gray-900">{from}</span> - <span className="font-medium text-gray-900">{to}</span> dari <span className="font-medium text-gray-900">{total}</span> data
                    </div>

                    <div className="flex gap-1">
                        {links.map((link, key) => (
                            <Link
                                key={key}
                                href={link.url || '#'}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${link.active
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : !link.url
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
