function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
          cookie = cookie.trim();
          if (cookie.startsWith(name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

function callComponentMethod(componentId, methodName) {
  fetch('/', {
      method: "POST",
      headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')  
      },
      body: JSON.stringify({
          component: componentId,
          method: methodName
      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Erreur réseau ou serveur');
      }
      return response.json();
  })
  .then(data => {
      console.log('Réponse du serveur:', data);
      document.querySelector(`#${componentId}`).outerHTML = data.html;
  })
  .catch(error => {
      console.error('Erreur:', error.message);
  });
}