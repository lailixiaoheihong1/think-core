<?php
namespace Qscmf\Controller;

use Qscmf\Lib\CusUpload;
use Qscmf\Lib\FileUploadManager\File;
use Qscmf\Lib\FileUploadManager\Manager;
use Think\Controller;
use Think\Hook;

class FileUploadController extends Controller{

    private function checkRequired($post_data, $required){
        foreach($required as $key){
            if(!isset($post_data[$key])){
                E("缺少参数" . $key);
                return false;
            }
        }
        return true;
    }

    /*
     * upload前置接口
     *
     * 请求方法: GET
     *
     * 必填参数
     * title: 文件名
     * cate: config upload分类
     *
     * 选填参数
     * hash_id: 文件hash_id
     */
    public function upload(){
        $get_data = I('get.');

        $this->checkRequired($get_data, ['title', 'cate']);

        $return_params = [
            'cate' => $get_data['cate']
        ];

        if(isset($get_data['hash_id']) && strlen($get_data['hash_id']) < 32){
            $ajax = array(
                'status' => 0,
                'server_url' => U("uploadFile", $return_params, false, true)
            );
            $this->ajaxReturn($ajax);
        }

        $return_params['hash_id'] = $get_data['hash_id'];

        $key = 'UPLOAD_TYPE_' . strtoupper($get_data['cate']);
        if(C($key, null, '') == '') {
            E("没有配置" . $key . "类型的上传配置");
        }
        $upload_config = C($key);

        $data = $get_data;
        $data['security'] = isset($upload_config['security']) ? 1 : 0;
        $data['owner'] = isset($upload_config['security']) ? session(C('USER_AUTH_KEY')) : 0;

        $manager = new Manager(new File($data));
        if($manager->isExists()){
            $file_id = $manager->mirror();
            if($file_id !== false){
                $ajax = [
                    'status' => 1,
                    'file_id' => $file_id,
                    'url' => HTTP_PROTOCOL . "://" . SITE_URL . showFileUrl($file_id),
                    'server_url' => U("uploadFile", $return_params, false, true)
                ];

                Hook::listen('uploadFileSuccess', $ajax);

                $this->ajaxReturn($ajax);
            }
        }

        $ajax = array(
            'status' => 0,
            'server_url' => U("uploadFile", $return_params, false, true)
        );
        $this->ajaxReturn($ajax);

    }


    /*
     * 上传文件接口
     *
     * 请求方法: POST
     *
     * 必填参数
     * cate: config upload分类 通过url拼接传参
     * file: 文件
     *
     * 选填参数
     * hash_id: 文件hash_id 通过url拼接传参
     */
    public function uploadFile(){
        $get_data = I("get.");

        $this->checkRequired($get_data, ['cate']);

        $key = 'UPLOAD_TYPE_' . strtoupper($get_data['cate']);
        if(C($key, null, '') == '') {
            E("没有配置" . $key . "类型的上传配置");
        }
        $upload_config = C($key);

        $upload = new CusUpload($upload_config);
        $info = $upload->upload();
        if(!$info){
            $this->error($upload->getError());
        }
        else{
            $file_info = array_pop($info);

            $data = [
                'file' => $file_info['savepath'] . $file_info['savename'],
                'title' => $file_info['name'],
                'size' => $file_info['size'],
                'cate' => $get_data['cate'],
                'hash_id' => isset($get_data['hash_id']) ? $get_data['hash_id'] : '',
                'mime_type' => $file_info['type'],
                'security' => isset($upload_config['security']) ? 1 : 0,
                'owner' => isset($upload_config['security']) ? session(C('USER_AUTH_KEY')) : 0,
            ];

            $file = new File($data);
            $manager = new Manager($file);
            $file_id = $manager->add();

            $ajax = [
                'status' => 1,
                'file_id' => $file_id,
                'url' => HTTP_PROTOCOL . "://" . SITE_URL . showFileUrl($file_id),
            ];

            Hook::listen('uploadFileSuccess', $ajax);

            $this->ajaxReturn($ajax);
        }


    }
}