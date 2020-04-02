<?php
namespace Qscmf\Builder\FormType\Textarea;

use Qscmf\Builder\FormType\FormType;
use Think\View;

class Textarea implements FormType {

    public function build(array $form_type){
        $view = new View();
        $view->assign('form', $form_type);
        $content = $view->fetch(__DIR__ . '/textarea.html');
        return $content;
    }
}