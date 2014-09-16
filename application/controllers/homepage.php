<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Homepage extends CI_Controller {
	public function index() {
    $data = [
      'page'=>'homepage/main',
      'top_class'=>'content-homepage'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
