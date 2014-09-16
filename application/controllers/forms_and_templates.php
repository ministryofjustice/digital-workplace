<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Forms_and_templates extends CI_Controller {
	public function index() {
    $data = [
      'page'=>'forms_and_templates/main',
      'top_class'=>'content-forms-and-templates'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
