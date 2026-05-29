from django.contrib import admin
from .models import User, Question, Response, Mastery, LearningEvent, SpacedRepetitionQueue

admin.site.register(User)
admin.site.register(Question)
admin.site.register(Response)
admin.site.register(Mastery)
admin.site.register(LearningEvent)
admin.site.register(SpacedRepetitionQueue)
