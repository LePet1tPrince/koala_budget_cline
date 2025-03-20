from django.urls import path
from .views import FlowReportView, BalanceReportView, SavingGoalsReportView, NetWorthHistoryView

urlpatterns = [
    path('flow/', FlowReportView.as_view(), name='flow_report'),
    path('balance/', BalanceReportView.as_view(), name='balance_report'),
    path('saving-goals/', SavingGoalsReportView.as_view(), name='saving_goals_report'),
    path('net-worth-history/', NetWorthHistoryView.as_view(), name='net_worth_history'),
]
