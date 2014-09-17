<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Guidance_and_support extends CI_Controller {
	public function index() {
    $data = [
      'page'=>'guidance_and_support/main',
      'top_class'=>'content-guidance-and-support'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
