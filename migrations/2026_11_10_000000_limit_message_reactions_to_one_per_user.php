<?php

/*
 * This file is part of ramon/chat.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        // Keep the most recently inserted reaction for each user/message pair.
        $connection = $schema->getConnection();
        $lastPair = null;
        $duplicates = [];

        foreach (
            $connection->table('chat_message_reactions')
                ->select(['id', 'message_id', 'user_id'])
                ->orderBy('message_id')
                ->orderBy('user_id')
                ->orderByDesc('id')
                ->cursor() as $reaction
        ) {
            $pair = $reaction->message_id.':'.$reaction->user_id;

            if ($pair === $lastPair) {
                $duplicates[] = $reaction->id;
            } else {
                $lastPair = $pair;
            }

            if (count($duplicates) >= 500) {
                $connection->table('chat_message_reactions')->whereIn('id', $duplicates)->delete();
                $duplicates = [];
            }
        }

        if ($duplicates !== []) {
            $connection->table('chat_message_reactions')->whereIn('id', $duplicates)->delete();
        }

        $oldIndex = $connection->getTablePrefix().'chat_message_reactions_message_id_user_id_emoji_unique';

        $schema->table('chat_message_reactions', function (Blueprint $table) use ($oldIndex) {
            $table->dropUnique($oldIndex);
            $table->unique(['message_id', 'user_id'], 'chat_reaction_message_user_unique');
        });
    },

    'down' => function (Builder $schema) {
        $schema->table('chat_message_reactions', function (Blueprint $table) {
            $table->dropUnique('chat_reaction_message_user_unique');
            $table->unique(['message_id', 'user_id', 'emoji']);
        });
    },
];
