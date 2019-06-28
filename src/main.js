chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
	
		var linkTextNode = function(node) {
			var m;
			var txt = node.textContent;
			var span = null;
			var jiraRegEx = /(?:\s|^)([A-Z]+-[0-9]+)(?=\s|$)/g;

			while ( (m=jiraRegEx.exec(txt)) !== null)
			{
				if (null===span) {
					span=document.createElement('span');
				}
				a=document.createElement('a');
				a.className='linkclass';
				a.appendChild(document.createTextNode(m[0]));
				a.setAttribute('href', 'https://scribdjira.atlassian.net/browse/' + m[0].trim());
				a.setAttribute('target', '_blank');
				span.appendChild(a);
			}
			
			if (span) {
				try {
					node.appendChild(span);
				} catch (e) {
					console.error(e);
					console.log(node);
				}
			}
		}

		var handle_message = function(message){
			linkTextNode(message);
		}

		// Credit: https://github.com/ketanbhatt/block-slack-users
		message_div = $('#messages_container')  // Parent div that contains main messages
		thread_div = $('#flex_contents')  // Parent div that contains threads in sidebar

		chrome.storage.sync.get({
			blockedUsers: "",
			onlyBlockDMs: false,
			enableExtension: true
		}, function(items) {
			blockedUsers = items.blockedUsers.split(',');
			onlyBlockDMs = items.onlyBlockDMs;
			enableExtension = items.enableExtension;

			if (enableExtension == false){
				return
			}

			// Add function to Remove messages from the main window
			message_div.bind('DOMNodeInserted', function(event){
				if (onlyBlockDMs && !is_dm_window()) {
					return
				}

				event_target = event.target;

				// Handle new incoming messages
				if (event_target.className == "c-virtual_list__item"){
					handle_message(event_target, false)
				} 

			})

			// Add function to Remove messages from threads
			thread_div.bind('DOMNodeInserted', function(event){
				event_target = event.target;

				// Handle new incoming thread messages
				if (event_target.tagName == "TS-MESSAGE"){
					handle_message(event_target, true)
				} 

				// Handle Thread history loading
				else if (event_target.className == 'day_container'){
					messages = event_target.getElementsByTagName('ts-message')
					for (i=0; i<messages.length; i++){
						handle_message(messages[i], true)
					}
				}
			})

			// Handle main messages' history
			all_messages = $('.c-virtual_list__item')
			for (i=0; i<all_messages.length; i++){
				handle_message(all_messages[i], false)
			}

			// Handle thread's history
			messages = document.getElementsByTagName('ts-message')
			for (i=0; i<messages.length; i++){
				handle_message(messages[i], true)
			}

		});
	}
	}, 10);
});