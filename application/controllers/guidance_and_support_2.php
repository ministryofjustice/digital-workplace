<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Guidance_and_support_2 extends CI_Controller {
  public function __construct(){
    parent::__construct();
    $this->load->model('guidance_and_support_model');
  }

	public function index(){
    $data = [
      'page'=>'guidance_and_support_2/main',
      'top_class'=>'content-guidance-and-support-2',
      'list'=>$this->guidance_and_support_model->get_list()
    ];

    //echo'<pre>';
    //print_r($data['list']);
    //echo'</pre>';

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
