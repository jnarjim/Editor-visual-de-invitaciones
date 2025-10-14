from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import base64
import os
from django.conf import settings


def editor_view(request):
    return render(request, 'invitaciones/editor.html')

@csrf_exempt
def guardar_invitacion(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            imagen_base64 = data.get('imagen')

            # Decodificar la imagen
            format, imgstr = imagen_base64.split(';base64,')

            # Crear directorio si no existe
            media_dir = os.path.join(settings.MEDIA_ROOT, 'invitaciones')
            os.makedirs(media_dir, exist_ok=True)

            # Guardar imagen
            file_path = os.path.join(media_dir, 'invitacion_temp.png')
            with open(file_path, 'wb') as f:
                f.write(base64.b64decode(imgstr))

            return JsonResponse({
                'success': True,
                'message': 'Invitación guardada correctamente'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)

    return JsonResponse({'success': False}, status=400)