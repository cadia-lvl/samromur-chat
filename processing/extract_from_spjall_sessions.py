#!/usr/bin/env python3

'''
    Author: Judy Fong - lvl@judyyfong.xyz
    Description: Extract the list of session ids from spjall sessions.
    License Apache 2.0
'''

import json
import urllib.request
import sys


def download_url(session_url, session_id):
    '''
        Get the contents of the download url and save them as a zip archive in
        the current directory.
    '''
    with urllib.request.urlopen(session_url) as dl_file:
        with open(session_id + '.zip', 'wb') as out_file:
            out_file.write(dl_file.read())


def calculate_total_time(total_seconds, total_valid_seconds,
                         total_partial_seconds):
    '''
        Calculate the following totals
            valid+partially valid hrs,
            valid hrs,
            partially valid hrs
    '''
    # TODO: better format the time
    print(str(total_seconds/3600) +
          ' hrs/20 hrs collected on spjall')
    print(str(total_valid_seconds/3600) +
          ' total valid hrs')
    print(str(total_partial_seconds/3600) + ' partially valid hrs')


def main():
    '''
        Using a json list of all sessions, label the sessions as valid,
        partially valid or not valid. Also, add in two conversations not
        recorded in spjall but will be used for the collection.
        Also, call calculate_total_time

    '''
    sessions_url = 'https://spjall.samromur.is/api/sessions'
    data = urllib.request.urlopen(sessions_url).read().decode()
    sessions = json.loads(data)
    total_seconds = 0
    total_partial_seconds = 0
    total_valid_seconds = 0
    valid_sessions = ['01119679-3adf-4da1-9581-65779c1c3f7d',
                      '2284fd64-848a-4516-8ffd-e104575f930b',
                      '2a07b3a7-9495-4782-9eb7-c6295512310c',
                      '2ecf1db5-1ec8-44cb-a9f8-a1a31dc337cc',
                      '2c1b4416-5f89-46f6-9b96-09bff54badab',
                      '2f1655ff-ddbc-4581-bd97-4727b5ae7ca3',
                      '50d1de3c-5b4c-4404-914e-602a7d91b4c3',
                      '5331448b-8c5f-4f98-9ca2-f97321a385b1',
                      '54ddefa8-a7db-437b-a7d1-31a378396222',
                      '81dd3246-3e3d-4f60-9f4f-c050485b1551',
                      '2d219d50-728f-4e10-9bf5-5c7895a82934',
                      'ad46e29b-eea2-4c3d-adfb-35727f65d961',
                      'b107d272-73c7-45d2-af9e-9ded79697fd3',
                      'de3b604f-f3a5-4400-9f47-1872f8907a2c',
                      'e25bc38d-26bc-42e0-9d81-13ccedfe6072']
    partial_sessions = ['3ac74ae1-0fd0-40ae-b85b-ca4456122004',
                        '334c8c37-90d7-4269-a164-a7bf762a09f5',
                        '2651b605-cd91-40ef-96e6-71b250a3e467',
                        '038d54f9-0d0e-42db-864a-e8369f4da021',
                        '171f4b4f-e5d5-44b1-aac8-ff046275560c',
                        '444ea9cc-f5a6-45a5-90be-39e4e0a26af1',
                        '5f55950e-0602-409c-b7e2-f7c1f0881b48',
                        '9a67bc98-eaf2-4ba3-be01-dfb8914ff28d',
                        'a552db29-8bca-4e2e-b766-36d6a31f5000',
                        '198f2863-88e6-40e9-89bd-381e15a93739',
                        '7f09cd67-785d-463f-928f-34c7ef5fc07d',
                        'b6ad9f96-1e34-4a6f-b2db-06c86d2b202d',
                        'f123a375-79ac-4748-928a-20f754ccca66']
    invalid_sessions = ['2474fff6-929b-4642-88ae-b79f2fda6be4',
                        '319735f1-f2bc-41db-908d-00023eeea23a',
                        '3edaad06-4170-4701-b053-2b17172d4723',
                        '43f56f8e-d636-45a6-b35c-782226811a8f',
                        '4e66174f-8ca4-4fad-8a94-6e0f311efe2d',
                        '667e9eb3-cd1b-48b0-a288-ffdc10bfc649',
                        '6b610432-9630-442e-88fa-399ac4130b86',
                        '919a64bc-8b68-404e-ba59-710fb11d1675',
                        '96f4a939-efbf-4cd6-8d0a-406f84d0b984',
                        'ae33c317-8fcc-45f4-879a-60cc67dff9e4',
                        'caa6301e-a2b2-4c17-8d22-3bc19c360ee3',
                        'd1149b6c-aa8b-4015-b5f8-a141732ac46f',
                        'd544fd24-b8f3-4aa6-b21a-936a05b30d99',
                        'dbf7e96a-ba4e-4bd9-9bda-10dfd0d87eaa',
                        'e6114cd7-f610-402d-b6cd-70783614817b',
                        'e8774e4c-963e-4fce-9e6f-09bde60c0941',
                        'e90b99b7-84cd-4b19-9403-81384dd3150f']

    with open('spjall_sessions.csv', 'w') as recorded_sessions:
        print('session id,usable,name', file=recorded_sessions)
        for session in sessions:
            # When client recording has a duration of null then assign it as a
            # partial recording
            if session['session_id'] in partial_sessions or \
              session['client_a']['duration_seconds'] is None or \
              session['client_b']['duration_seconds'] is None:
                print(session['session_id'] + ',P,', file=recorded_sessions)
                if session['client_b']['duration_seconds']:
                    client_duration = session['client_b']['duration_seconds']
                elif session['client_a']['duration_seconds']:
                    client_duration = session['client_a']['duration_seconds']
                else:
                    client_duration = 0
                total_partial_seconds += client_duration
                total_seconds += client_duration
            elif session['session_id'] in valid_sessions:
                print(session['session_id'] + ',Y,', file=recorded_sessions)
                total_valid_seconds += session['client_a']['duration_seconds']
                total_seconds += session['client_a']['duration_seconds']
            elif session['session_id'] in invalid_sessions:
                print(session['session_id'] + ',N,', file=recorded_sessions)
            # Exclude sessions where an age or gender is not provided
            elif (session['client_a']['age'] and session['client_b']['age']
                  != ''):
                print(session['session_id'] + ',Y,', file=recorded_sessions)
                total_valid_seconds += session['client_a']['duration_seconds']
                total_seconds += session['client_a']['duration_seconds']
                download_url(sessions_url + '/' + session['session_id'],
                             session['session_id'])
            else:
                print(session['session_id'] + ',N,', file=recorded_sessions)
        print('30509101-ed6a-4153-b58c-085cea60f079 ,P,,not \
            on mamma karl tvitugt', file=recorded_sessions)
        client_a_duration = 10*60+1
        total_seconds += client_a_duration
        total_partial_seconds += client_a_duration
        print('38ced83e-c37d-4687-8f60-bd2332c7ab2d,P,,not on mamma',
              file=recorded_sessions)
        client_a_duration = 16*60+9
        total_seconds += client_a_duration
        total_partial_seconds += client_a_duration
        print('42ae267b-891f-4232-b99b-fdc78da4986b,P,,not on mamma kona \
            thritugt 2 voice one channel', file=recorded_sessions)
        client_a_duration = 13*60+30
        total_seconds += client_a_duration
        total_partial_seconds += client_a_duration
        # a monologue has different characteristics from a conversation so not
        # valid data
        print('66f4f282-79c3-4f14-bcf8-fcc7bf401fd2,N,,not on mamma monologue',
              file=recorded_sessions)
        client_a_duration = 17*60+4
        print('c08bdf8a-8a21-4a60-a558-6bf0f5e30b93,P,,not on mamma',
              file=recorded_sessions)
        client_a_duration = 16*60+1
        total_seconds += client_a_duration
        total_partial_seconds += client_a_duration
        print('non-spjall recording,Y,convo 2,', file=recorded_sessions)
        total_seconds += (32*60+38)
        total_valid_seconds += (32*60+38)
        print('pre-spjall recording,Y,convo 1,', file=recorded_sessions)
        total_seconds += (1*60+2)
        total_valid_seconds += (1*60+2)

    calculate_total_time(total_seconds, total_valid_seconds,
                         total_partial_seconds)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=
                                     '''
            Extract the list of session ids from spjall api/sessions
        ''')
    args = parser.parse_args()
    main()
    sys.exit(0)
