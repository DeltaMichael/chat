<?php

/*
 * This file is part of ramon/chat.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Ramon\Chat\Tests\integration\api;

use Flarum\Testing\integration\TestCase;
use Ramon\Chat\Tests\integration\ResetsVisibilityScopers;

/**
 * Quem atende o "Enviar mensagem" com o flarum/messages ligado vai ao fórum como
 * atributo: o cliente decide entre o botão dele e o do chat.
 */
class DirectMessagesProviderTest extends TestCase
{
    use ResetsVisibilityScopers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resetVisibilityScopers();

        $this->extension('ramon-chat');
    }

    private function provider(): mixed
    {
        $response = $this->send($this->request('GET', '/api'));

        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());

        return json_decode((string) $response->getBody(), true)['data']['attributes']['ramon-chat.directMessagesProvider'] ?? null;
    }

    public function test_the_flarum_messages_button_is_kept_by_default(): void
    {
        $this->assertSame('messages', $this->provider());
    }

    public function test_the_admin_can_hand_it_to_the_chat(): void
    {
        $this->setting('ramon-chat.direct_messages_provider', 'chat');

        $this->assertSame('chat', $this->provider());
    }
}
