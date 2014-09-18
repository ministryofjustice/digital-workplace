<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Links extends CI_Controller {
	public function index() {
    $data = [
      'links'=>[
        'v1'=>[
          'Homepage'=>'homepage?v=1',
          'Forms &amp; templates'=>'forms_and_templates?v=1'
        ],
        'v2'=>[
          'Homepage'=>'homepage?v=2',
          'News &amp; features'=>'news_and_features?v=2',
          'Guidance &amp; support'=>'guidance_and_support?v=2',
          'About'=>'about?v=2',
          'Forms &amp; templates'=>'forms_and_templates?v=2'
        ]
      ]
    ];

		$this->load->view('links/main', $data);
	}
}
