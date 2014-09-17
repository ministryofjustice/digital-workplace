<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class About extends CI_Controller {
	public function index() {
    $data = [
      'page'=>'about/main',
      'top_class'=>'content-about'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
