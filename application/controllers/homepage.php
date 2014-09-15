<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Homepage extends CI_Controller {
	public function index() {
    $data = [
      'page'=>'homepage/main'
    ];

		$this->load->view('v1/layouts/default', $data);
	}
}
