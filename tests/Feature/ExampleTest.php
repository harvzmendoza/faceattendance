<?php

test('guests are redirected to login', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});
