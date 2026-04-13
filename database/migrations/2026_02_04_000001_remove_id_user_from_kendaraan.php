<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kendaraan', function (Blueprint $table) {
            // Drop foreign key first if it exists
            $table->dropForeign(['id_user']);
            // Then drop column
            $table->dropColumn('id_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kendaraan', function (Blueprint $table) {
            $table->foreignId('id_user')->nullable()->constrained('users', 'id_user')->onDelete('cascade');
        });
    }
};
