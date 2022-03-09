<?php

/** Enable auto-login for SQLite
 * @link https://www.adminer.org/plugins/#use
 * @author Jakub Vrana, https://www.vrana.cz/
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @license http://www.gnu.org/licenses/gpl-2.0.html GNU General Public License, version 2 (one or other)
 */
class AdminerLoginSqlite
{

    function login($login, $password)
    {
        return true;
    }

    function loginForm()
    {
?>
        <script<?php echo nonce(); ?>>
            addEventListener('load', function () {
            var driver = document.getElementsByName('auth[driver]')[0];
            if (isTag(driver, 'select')) {
            driver.onchange = function () {
            var trs = parentTag(driver, 'table').rows;
            for (var i=1; i < trs.length - 1; i++) { var disabled=/sqlite/.test(driver.value); alterClass(trs[i], 'hidden' , disabled); trs[i].getElementsByTagName('input')[0].disabled=disabled; } }; } driver.onchange(); }); </script>
        <?php
    }
}

return new AdminerLoginSqlite();
